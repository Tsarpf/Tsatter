ENV['VAGRANT_DEFAULT_PROVIDER'] = 'docker'
CURRENT_PATH = File.dirname(File.expand_path(__FILE__))

Vagrant.configure("2") do |config|

  config.vm.synced_folder "environment/", "/home/environment/src"
  config.vm.synced_folder ".", "/vagrant", disabled: true

  config.vm.define "db" do |a|
    a.vm.provider "docker" do |d|
      d.name = "db"
      d.image = "mongo"
      d.ports = ["27017:27017"]
      d.remains_running = true
      d.vagrant_machine = "ubuntu_dockerhost"
      d.vagrant_vagrantfile = "./dockerhost/Vagrantfile"
    end
  end

  config.vm.define "webapp" do |a|
    a.vm.provider "docker" do |d|
      d.name = "tsatter-web"
      d.build_dir = "."
      d.ports = ["3000:3000"]
      d.link("db:db_1")
      d.remains_running = true
      d.vagrant_machine = "ubuntu_dockerhost"
      d.vagrant_vagrantfile = "./dockerhost/Vagrantfile"
    end
  end

end
