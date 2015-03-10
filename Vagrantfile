ENV['VAGRANT_DEFAULT_PROVIDER'] = 'docker'

Vagrant.configure("2") do |config|

  config.vm.synced_folder ".", "/vagrant", disabled: true

  config.vm.provider "docker" do |d|
    d.remains_running = true
    d.vagrant_machine = "ubuntu_dockerhost"
    d.vagrant_vagrantfile = "./dockerhost/Vagrantfile"
  end

  config.vm.define "db" do |a|
    a.vm.provider "docker" do |d|
      d.name = "db"
      d.image = "mongo"
    end
  end

  config.vm.define "inspirk" do |a|
    a.vm.synced_folder "inspircd/conf", "/inspircd/conf"
    a.vm.provider "docker" do |d|
      d.name = "inspirk"
      d.build_dir = "./inspircd"
    end
  end

  config.vm.define "webapp" do |a|
    a.vm.synced_folder "environment/", "/home/nonroot/environment/src"
    a.vm.provider "docker" do |d|
      d.name = "tsatter-web"
      d.build_dir = "."
      d.ports = ["3000:3000"]
      d.link("db:db_1")
      d.link("inspirk:ircserver")
    end
  end

end
